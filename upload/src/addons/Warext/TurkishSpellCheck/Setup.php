<?php

namespace Warext\TurkishSpellCheck;

use XF\AddOn\AbstractSetup;
use XF\AddOn\StepRunnerInstallTrait;
use XF\AddOn\StepRunnerUninstallTrait;
use XF\AddOn\StepRunnerUpgradeTrait;
use XF\Db\Schema\Create;

class Setup extends AbstractSetup
{
    use StepRunnerInstallTrait;
    use StepRunnerUpgradeTrait;
    use StepRunnerUninstallTrait;

    public function installStep1(): void
    {
        $this->schemaManager()->createTable('xf_warext_spell_cache', function (Create $table)
        {
            $table->addColumn('word_hash', 'varbinary', 32)->primaryKey();
            $table->addColumn('word', 'varchar', 96);
            $table->addColumn('is_correct', 'tinyint')->setDefault(0);
            $table->addColumn('suggestions', 'mediumblob')->nullable();
            $table->addColumn('provider', 'varchar', 32)->setDefault('');
            $table->addColumn('expires_date', 'int')->setDefault(0);
            $table->addKey('expires_date');
        });
    }

    public function upgrade1020100Step1(): void
    {
        $this->clearCache();
    }

    public function upgrade1020200Step1(): void
    {
        $this->clearCache();
    }

    public function upgrade1030000Step1(): void
    {
        $this->clearCache();
        $this->removeFiles([
            'warext_spellcheck.php',
            'js/warext/turkish-spellcheck/editor-v114.js',
            'js/warext/turkish-spellcheck/editor-v121.js',
            'js/warext/turkish-spellcheck/editor-v122.js',
            'js/warext/turkish-spellcheck/editor-v123.js',
            'js/warext/turkish-spellcheck/editor-v124.js'
        ]);
    }

    public function upgrade1030100Step1(): void
    {
        $this->removeFiles([
            'js/warext/turkish-spellcheck/dictionary-v130.js',
            'js/warext/turkish-spellcheck/editor-v130.js'
        ]);
    }

    public function upgrade1030200Step1(): void
    {
        $this->removeFiles([
            'js/warext/turkish-spellcheck/dictionary-v131.js',
            'js/warext/turkish-spellcheck/editor-v131.js',
            'js/warext/turkish-spellcheck/bootstrap-v131.js'
        ]);
    }

    public function upgrade1040000Step1(): void
    {
        $this->removeFiles([
            'js/warext/turkish-spellcheck/dictionary-v132.js',
            'js/warext/turkish-spellcheck/editor-v132.js',
            'js/warext/turkish-spellcheck/bootstrap-v132.js'
        ]);
    }

    public function upgrade1040100Step1(): void
    {
        $this->removeFiles([
            'js/warext/turkish-spellcheck/dictionary-v140.js',
            'js/warext/turkish-spellcheck/editor-v140.js',
            'js/warext/turkish-spellcheck/bootstrap-v140.js'
        ]);
    }

    public function upgrade1040200Step1(): void
    {
        $this->removeFiles([
            'js/warext/turkish-spellcheck/dictionary-v141.js',
            'js/warext/turkish-spellcheck/editor-v141.js',
            'js/warext/turkish-spellcheck/bootstrap-v141.js'
        ]);
    }

    public function upgrade1060000Step1(): void
    {
        $this->clearCache();
        $this->removeFiles([
            'js/warext/turkish-spellcheck/dictionary-v142.js',
            'js/warext/turkish-spellcheck/editor-v142.js',
            'js/warext/turkish-spellcheck/bootstrap-v142.js'
        ]);
    }

    public function uninstallStep1(): void
    {
        $this->schemaManager()->dropTable('xf_warext_spell_cache');
    }

    private function clearCache(): void
    {
        try
        {
            $this->query('TRUNCATE TABLE xf_warext_spell_cache');
        }
        catch (\Throwable $e)
        {
        }
    }

    private function removeFiles(array $files): void
    {
        try
        {
            $root = \XF::getRootDirectory();
            foreach ($files as $relative)
            {
                $file = $root . '/' . $relative;
                if (is_file($file))
                {
                    @unlink($file);
                }
            }
        }
        catch (\Throwable $e)
        {
        }
    }
}
