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

    public function upgrade4000070Step1(): void
    {
        try
        {
            $this->query('TRUNCATE TABLE xf_warext_spell_cache');
        }
        catch (\Throwable $e)
        {
        }

        try
        {
            $root = \XF::getRootDirectory();
            $files = [
                '/warext_spellcheck.php',
                '/js/warext/turkish-spellcheck/editor-v114.js',
                '/js/warext/turkish-spellcheck/editor-v121.js',
                '/js/warext/turkish-spellcheck/editor-v122.js',
                '/js/warext/turkish-spellcheck/editor-v123.js',
                '/js/warext/turkish-spellcheck/editor-v124.js',
                '/js/warext/turkish-spellcheck/dictionary-v130.js',
                '/js/warext/turkish-spellcheck/editor-v130.js',
                '/js/warext/turkish-spellcheck/dictionary-v131.js',
                '/js/warext/turkish-spellcheck/editor-v131.js',
                '/js/warext/turkish-spellcheck/bootstrap-v131.js',
                '/js/warext/turkish-spellcheck/dictionary-v132.js',
                '/js/warext/turkish-spellcheck/editor-v132.js',
                '/js/warext/turkish-spellcheck/bootstrap-v132.js',
                '/js/warext/turkish-spellcheck/dictionary-v140.js',
                '/js/warext/turkish-spellcheck/editor-v140.js',
                '/js/warext/turkish-spellcheck/bootstrap-v140.js',
                '/js/warext/turkish-spellcheck/dictionary-v141.js',
                '/js/warext/turkish-spellcheck/editor-v141.js',
                '/js/warext/turkish-spellcheck/bootstrap-v141.js',
                '/js/warext/turkish-spellcheck/dictionary-v142.js',
                '/js/warext/turkish-spellcheck/editor-v142.js',
                '/js/warext/turkish-spellcheck/bootstrap-v142.js',
                '/js/warext/turkish-spellcheck/dictionary-v160.js',
                '/js/warext/turkish-spellcheck/editor-v160.js',
                '/js/warext/turkish-spellcheck/bootstrap-v160.js',
                '/js/warext/turkish-spellcheck/rules-v160.js',
                '/js/warext/turkish-spellcheck/worker-v160.js',
                '/js/warext/turkish-spellcheck/dictionary-v200.js',
                '/js/warext/turkish-spellcheck/editor-v200.js',
                '/js/warext/turkish-spellcheck/bootstrap-v200.js',
                '/js/warext/turkish-spellcheck/dictionary-v210.js',
                '/js/warext/turkish-spellcheck/editor-v210.js',
                '/js/warext/turkish-spellcheck/bootstrap-v210.js',
                '/js/warext/turkish-spellcheck/dictionary-v220.js',
                '/js/warext/turkish-spellcheck/editor-v220.js',
                '/js/warext/turkish-spellcheck/bootstrap-v220.js',
                '/js/warext/turkish-spellcheck/dictionary-v230.js',
                '/js/warext/turkish-spellcheck/editor-v230.js',
                '/js/warext/turkish-spellcheck/bootstrap-v230.js',
                '/js/warext/turkish-spellcheck/bootstrap-v300.js',
                '/js/warext/turkish-spellcheck/bootstrap-v310.js'
            ];
            foreach ($files as $file)
            {
                $path = $root . $file;
                if (is_file($path))
                {
                    @unlink($path);
                }
            }
        }
        catch (\Throwable $e)
        {
        }
    }

    public function uninstallStep1(): void
    {
        $this->schemaManager()->dropTable('xf_warext_spell_cache');
    }
}
